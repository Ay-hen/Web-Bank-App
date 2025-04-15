import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const jwtToken = localStorage.getItem('token');
    if (jwtToken) {
        var cloned = req.clone({
        setHeaders: {
            Authorization: `Bearer ${jwtToken}`,
        },
        });

        return next(cloned);
    }

    return next(req);
};

function getJwtToken(): string | null {
    let tokens: any = localStorage.getItem('token');
    if (!tokens) return null;
    
    return tokens;
}